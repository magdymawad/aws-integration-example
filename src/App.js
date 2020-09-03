import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Button, Card, CardBody, Col, Form, FormGroup, Row } from "reactstrap";
import * as axios from 'axios';

const apiHost = "http://localhost:3000/v1";
const filesHost = "https://mawad-root.s3.eu-central-1.amazonaws.com"


const App = (props) => {
  const { handleSubmit, register, errors } = useForm();

  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreviewUrl, setImgPreviewUrl] = useState(null);
  const [uploadedImagePreviewUrl, setUploadedImgPreviewUrl] = useState(null);
  const [isLoading, setLoading] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  const profileImgHandler = event => {
    setSelectedFile(event.target.files[0]);

    const reader = new FileReader();
    reader.onloadend = () => setImgPreviewUrl(reader.result);
    reader.readAsDataURL(event.target.files[0])

  }

  const onSubmit = async values => {
    try {

      setLoading(true);

      console.log('selectedFile: ', selectedFile);
      const uploadDetailsRes = await axios({
        method: 'post',
        url: `${apiHost}/uploads`,
        data: { contentType: selectedFile.type },
      });
      setUploadedImgPreviewUrl(`${filesHost}/${uploadDetailsRes.data.filePath}`);
      // setFeedbackMsg(uploadDetailsRes.data);

      const formData = new FormData();
      Object.entries(uploadDetailsRes.data.fields).forEach(([k, v]) => {
        formData.append(k, v);
      });
      formData.append("file", selectedFile); // must be the last one
      const uploadRes = await axios({
        method: "POST",
        url: uploadDetailsRes.data.url,
        data: formData,
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setFeedbackMsg(uploadRes.data);

      if (uploadRes.status === 204) {
        const randomNo = 10000 + Math.floor((Math.random() * 9999))
        const registerRes = await axios({
          method: 'post',
          url: `${apiHost}/buyers/register`,
          data: {
            "email": `test${randomNo}@test.com`,
            "phone": `012000${randomNo}`,
            "type": "CONSUMER",
            "address": {
              "cityId": "5f4913d2fbd9557ca479e64a"
            },
            "gender": "MALE",
            "name": "Buyer Name",
            "password": "1234",
            "language": "ar",

            // ! Note this attribute 
            // it's using filePath which is received from the post upload 
            "profileImg": uploadDetailsRes.data.filePath,
          },
        });

        setFeedbackMsg(registerRes.data);

      }

    } catch (err) {
      setFeedbackMsg(err);
    } finally {
      setLoading(false);
    }

  };


  let profileImgInput;
  return (
    <>
      <div>

        <Card className="bg-secondary shadow border-0">
          <CardBody className="px-lg-5 py-lg-5">
            <Form onSubmit={handleSubmit(onSubmit)}>

              <FormGroup>
                <div className="avatar-wrapper">
                  <img className="profile-pic" src={imagePreviewUrl} alt="profile-pic-placeholder" />
                  <div className="upload-button" onClick={() => profileImgInput.click()}>
                    <i className="fa fa-arrow-circle-up" aria-hidden="true"></i>
                  </div>
                  <input
                    name="profileImg" type="file" accept="image/*"
                    onChange={profileImgHandler}
                    ref={fileInput => {
                      profileImgInput = fileInput
                      return register({ required: true })(fileInput);
                    }}
                  />
                </div>
              </FormGroup>

              <div className="text-center">
                <Button className="mt-4" color="primary" type="submit" disabled={props.isAuthenticating}>
                  {isLoading ? "Loading..." : "Submit"}
                </Button>
              </div>
            </Form>

            {
              uploadedImagePreviewUrl && (
                <div>
                  <p>VIEW UPLOADED IMAGE: <a href={uploadedImagePreviewUrl} target="_blank">HERE</a></p>
                </div>
              )
            }

            {feedbackMsg && <PrettyPrintJson data={feedbackMsg} />}
          </CardBody>
        </Card>
      </div>
    </>
  );

}

const PrettyPrintJson = React.memo(({ data }) => (<div><pre>{
  JSON.stringify(data, null, 2)}</pre></div>));

export default App;